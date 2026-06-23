terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.30"
    }
  }
}

provider "kubernetes" {
  config_path    = var.kubeconfig_path
  config_context = var.kube_context
}

resource "kubernetes_namespace" "devops_demo" {
  metadata {
    name = var.namespace
    labels = {
      managed-by = "terraform"
      project     = "devops-demo"
    }
  }
}

resource "kubernetes_config_map" "app_config" {
  metadata {
    name      = "app-config"
    namespace = kubernetes_namespace.devops_demo.metadata[0].name
  }

  data = {
    USER_SERVICE_URL    = "http://user-service:4001"
    PRODUCT_SERVICE_URL = "http://product-service:4002"
  }
}
