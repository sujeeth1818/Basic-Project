# DevOps Demo: Microservices CI/CD on Minikube

End-to-end DevOps pipeline for a 3-service Node.js app (`api-gateway` → `user-service`, `product-service`),
built with Docker, provisioned with Terraform, deployed to Kubernetes (Minikube), and automated with Jenkins.

```
api-gateway (4000) --> user-service (4001)
                  \--> product-service (4002)
```

## Project layout

```
services/
  api-gateway/      Express gateway, proxies to the two backend services
  user-service/      In-memory user CRUD API
  product-service/   In-memory product CRUD API
k8s/                  Kubernetes manifests (Deployments, Services, Ingress)
terraform/            Provisions the namespace + ConfigMap on the cluster
Jenkinsfile           CI/CD pipeline: test -> build -> provision -> deploy -> verify
docker-compose.yml    Local multi-container run without Kubernetes
```

## Prerequisites

Install these on your machine first:

| Tool | Purpose | Check |
|---|---|---|
| Node.js 20+ | run/test services locally | `node -v` |
| Docker Desktop | build images | `docker -v` |
| Minikube | local Kubernetes cluster | `minikube version` |
| kubectl | talk to the cluster | `kubectl version --client` |
| Terraform | provision cluster resources | `terraform -v` |
| Jenkins | CI/CD orchestration | see Step 5 below |

---

## Step 1 — Run the services locally (sanity check, no containers)

```bash
cd services/user-service && npm install && npm test && npm start &
cd services/product-service && npm install && npm test && npm start &
cd services/api-gateway && npm install && npm test && npm start &
```

Then check:

```bash
curl http://localhost:4000/api/users
curl http://localhost:4000/api/products
```

Stop the background processes (`fg`/`kill`) once confirmed.

## Step 2 — Run with Docker Compose (containers, no Kubernetes yet)

```bash
docker compose up --build
```

Visit `http://localhost:4000/api/users` and `http://localhost:4000/api/products`.
Ctrl+C to stop, `docker compose down` to clean up.

## Step 3 — Start Minikube

```bash
minikube start --driver=docker
minikube addons enable ingress
```

Confirm the context Terraform/kubectl will use:

```bash
kubectl config current-context   # should print: minikube
```

## Step 4 — Provision cluster resources with Terraform

Terraform owns cluster-level setup (namespace + shared ConfigMap) — kubectl/Jenkins owns app deploys on top of it.

```bash
cd terraform
terraform init
terraform apply -auto-approve
cd ..
```

Verify:

```bash
kubectl get namespace devops-demo
kubectl -n devops-demo get configmap app-config
```

## Step 5 — Build images directly into Minikube's Docker daemon

Minikube has its own Docker engine; point your shell at it so images you build are visible to the cluster
without needing a registry push:

```bash
eval $(minikube docker-env)     # Linux/macOS
# or on Windows PowerShell:
# & minikube -p minikube docker-env --shell powershell | Invoke-Expression

docker build -t user-service:latest ./services/user-service
docker build -t product-service:latest ./services/product-service
docker build -t api-gateway:latest ./services/api-gateway
```

## Step 6 — Deploy to Kubernetes

```bash
kubectl apply -f k8s/user-service.yaml
kubectl apply -f k8s/product-service.yaml
kubectl apply -f k8s/api-gateway.yaml

kubectl -n devops-demo rollout status deployment/user-service
kubectl -n devops-demo rollout status deployment/product-service
kubectl -n devops-demo rollout status deployment/api-gateway
```

## Step 7 — Access the app

```bash
minikube service api-gateway -n devops-demo --url
```

Use the printed URL, e.g.:

```bash
curl <printed-url>/api/users
curl <printed-url>/api/products
```

Or via the Ingress (optional): add `<minikube ip> devops-demo.local` to your hosts file, then
`curl http://devops-demo.local/api/users`.

---

## Step 8 — Wire it up to Jenkins (automate steps 5-7)

1. **Install Jenkins** (any method is fine — Docker is simplest for local use):
   ```bash
   docker run -d --name jenkins -p 8080:8080 -p 50000:50000 \
     -v jenkins_home:/var/jenkins_home \
     -v /var/run/docker.sock:/var/run/docker.sock \
     jenkinsci/blueocean
   ```
2. Open `http://localhost:8080`, unlock with the initial admin password (`docker logs jenkins`), install
   suggested plugins, create an admin user.
3. Install the **Docker Pipeline**, **Kubernetes CLI**, and **Terraform** plugins (Manage Jenkins → Plugins).
4. Ensure the Jenkins agent has `docker`, `kubectl`, `terraform`, and `minikube` binaries on its `PATH`,
   and mount your `~/.kube/config` and `~/.minikube` into the Jenkins container/agent so it can reach
   your local cluster.
5. **New Item → Pipeline**, point "Pipeline script from SCM" at this repository, script path `Jenkinsfile`.
6. Click **Build Now**. The pipeline will:
   - Run unit tests for all 3 services
   - Build Docker images into Minikube's Docker daemon
   - `terraform apply` the namespace/config
   - `kubectl apply` the Deployments/Services/Ingress
   - Wait for rollouts to succeed

## Step 9 — Make a change and watch CI/CD do its job

1. Edit e.g. `services/product-service/index.js` (add a field, a route, whatever).
2. Commit and push.
3. Trigger the Jenkins job (or set up a webhook/poll-SCM trigger for full automation).
4. Watch the pipeline rebuild the image and roll out the new Deployment automatically.

## Troubleshooting

- **`ImagePullBackOff` in pods** — you built the image without `eval $(minikube docker-env)` first, so the
  cluster can't see it. Rebuild after setting that env, or `minikube image load <name>:latest`.
- **Terraform can't reach the cluster** — confirm `kubectl config current-context` is `minikube` and
  `~/.kube/config` is readable by whichever shell/user runs Terraform.
- **Ingress 404** — confirm `minikube addons enable ingress` ran and the ingress controller pod is `Running`
  (`kubectl -n ingress-nginx get pods`).
- **Jenkins can't find `kubectl`/`terraform`/`minikube`** — these need to be installed on the Jenkins
  agent itself (or mounted in if Jenkins runs in Docker), not just your host shell.

## Tearing down

```bash
kubectl delete -f k8s/api-gateway.yaml -f k8s/product-service.yaml -f k8s/user-service.yaml
cd terraform && terraform destroy -auto-approve && cd ..
minikube delete
```
