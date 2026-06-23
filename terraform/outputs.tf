output "namespace" {
  value = kubernetes_namespace.devops_demo.metadata[0].name
}
