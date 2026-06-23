variable "kubeconfig_path" {
  description = "Path to kubeconfig file"
  type        = string
  default     = "~/.kube/config"
}

variable "kube_context" {
  description = "Kubeconfig context to use (e.g. minikube)"
  type        = string
  default     = "minikube"
}

variable "namespace" {
  description = "Kubernetes namespace for the demo app"
  type        = string
  default     = "devops-demo"
}
