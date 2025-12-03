# MacroMind Terraform Makefile
# Convenient commands for Terraform operations

.PHONY: help init plan apply destroy validate fmt

.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "MacroMind Terraform Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

init: ## Initialize Terraform
	terraform init

validate: ## Validate Terraform configuration
	terraform validate

fmt: ## Format Terraform files
	terraform fmt -recursive

plan: ## Show execution plan
	terraform plan

plan-destroy: ## Show destroy plan
	terraform plan -destroy

apply: ## Apply Terraform configuration
	terraform apply

apply-auto: ## Apply with auto-approve (use with caution)
	terraform apply -auto-approve

destroy: ## Destroy infrastructure
	terraform destroy

destroy-auto: ## Destroy with auto-approve (use with extreme caution)
	terraform destroy -auto-approve

output: ## Show all outputs
	terraform output

output-kubeconfig: ## Show kubeconfig
	terraform output kubeconfig

output-configure: ## Show kubectl configure command
	terraform output configure_kubectl

refresh: ## Refresh Terraform state
	terraform refresh

show: ## Show current state
	terraform show

workspace-list: ## List workspaces
	terraform workspace list

workspace-new: ## Create new workspace (usage: make workspace-new NAME=dev)
	terraform workspace new $(NAME)

workspace-select: ## Select workspace (usage: make workspace-select NAME=dev)
	terraform workspace select $(NAME)

clean: ## Clean Terraform files (WARNING: Removes .terraform and state)
	@echo "WARNING: This will remove .terraform directory and state files!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		rm -rf .terraform terraform.tfstate* .terraform.lock.hcl; \
		echo "Cleaned Terraform files"; \
	fi

