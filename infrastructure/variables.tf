variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
}

variable "location" {
  type    = string
  default = "francecentral"
}

variable "prefix" {
  type    = string
  default = "fabric"
}

variable "vm_size" {
  type    = string
  default = "Standard_B4as_v2"
}

variable "admin_username" {
  type    = string
  default = "azureuser"
}

variable "ssh_public_key_path" {
  type    = string
  default = "~/.ssh/id_rsa.pub"
}