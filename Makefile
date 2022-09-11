AWS_PROFILE := default

include .env

.PHONY: nop
nop:

.PHONY: deploy
deploy:
	AWS_PROFILE=$(AWS_PROFILE) npx cdktf deploy

.PHONY: destroy
destroy:
	AWS_PROFILE=$(AWS_PROFILE) npx cdktf destroy
