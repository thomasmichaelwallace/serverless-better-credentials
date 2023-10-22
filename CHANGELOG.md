# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.0.0](https://github.com/thomasmichaelwallace/serverless-better-credentials/compare/v1.3.0...v2.0.0) (2023-10-22)


### ⚠ BREAKING CHANGES

* provider order updated to include additional providers

### Features

* add remaining default chain providers to profile chains ([39db5ca](https://github.com/thomasmichaelwallace/serverless-better-credentials/commit/39db5ca2a458e8b5819dfba57efaa8afb4be8154))


* bump packages ([5cef3bf](https://github.com/thomasmichaelwallace/serverless-better-credentials/commit/5cef3bf6f109852badc4abaa90e2db258a55a32f))

## [1.3.0](https://github.com/thomasmichaelwallace/serverless-better-credentials/compare/v1.2.1...v1.3.0) (2023-10-22)


### Features

* new enabled flag ([8d7b390](https://github.com/thomasmichaelwallace/serverless-better-credentials/commit/8d7b39003e309358578bd97a3d8aef29a2c4a1f1))

### [1.2.1](https://github.com/thomasmichaelwallace/serverless-better-credentials/compare/v1.2.0...v1.2.1) (2023-07-20)


### Bug Fixes

* add sso region when using new sso method ([467212c](https://github.com/thomasmichaelwallace/serverless-better-credentials/commit/467212cc6d408d301f267416ecdc343ed2dc4bcd))
* fix config and credentials file names ([0aa6859](https://github.com/thomasmichaelwallace/serverless-better-credentials/commit/0aa6859603e67d25cd89a9e6e9f95412d639353c))
* handle old aws-sdk versions ([ecc35c0](https://github.com/thomasmichaelwallace/serverless-better-credentials/commit/ecc35c024be3f540291ba1ca74e7b52ec675f83c))

## [1.2.0](https://github.com/thomasmichaelwallace/serverless-better-credentials/compare/v1.1.3...v1.2.0) (2023-07-02)


### Features

* complete test suite ([37bf081](https://github.com/thomasmichaelwallace/serverless-better-credentials/commit/37bf081eae2c8b225889bc628d8727ad2597dd15)), closes [#3](https://github.com/thomasmichaelwallace/serverless-better-credentials/issues/3)
* recode init load for new sso login ([97c77bf](https://github.com/thomasmichaelwallace/serverless-better-credentials/commit/97c77bfec0b0eed7088caf11147a645d0e0d1022))


### Bug Fixes

* clear env and promote m utility in tests ([9ea839d](https://github.com/thomasmichaelwallace/serverless-better-credentials/commit/9ea839d4d1e6ae86ad1f5b334101e3719a29738c))
* correct npm install command ([2126527](https://github.com/thomasmichaelwallace/serverless-better-credentials/commit/2126527518784e334ae4484458bde897575cd899))
* get upstream aws-sdk sso fixes ([168d76a](https://github.com/thomasmichaelwallace/serverless-better-credentials/commit/168d76a105b1ce4b6442e1763630f08afe5a3921))

### [1.1.3](https://github.com/thomasmichaelwallace/serverless-better-credentials/compare/v1.1.2...v1.1.3) (2022-08-10)


### Bug Fixes

* bump dependencies ([2296df4](https://github.com/thomasmichaelwallace/serverless-better-credentials/commit/2296df41cbcb05b4350fca8aeb62576b103848dc))

### [1.1.2](https://github.com/thomasmichaelwallace/serverless-better-credentials/compare/v1.1.1...v1.1.2) (2022-04-26)


### Bug Fixes

* guard against credential object being altered ([14ddedd](https://github.com/thomasmichaelwallace/serverless-better-credentials/commit/14ddeddf0d1d395138988753c76d7c6f96b343dc)), closes [#5](https://github.com/thomasmichaelwallace/serverless-better-credentials/issues/5)

### [1.1.1](https://github.com/thomasmichaelwallace/serverless-better-credentials/compare/v1.1.0...v1.1.1) (2022-02-23)


### Bug Fixes

* support serverless 2 and lowest sso enabled aws-sdk ([972b551](https://github.com/thomasmichaelwallace/serverless-better-credentials/commit/972b551e5acdead1552a78b88177cbf74083da2e))

## 1.1.0 (2022-02-23)


### Features

* log resolved credential provider ([5f683ae](https://github.com/thomasmichaelwallace/serverless-better-credentials/commit/5f683ae08a93d9b6918da6709ffdb420fe39b1c1))
* patch credentials ([aff949d](https://github.com/thomasmichaelwallace/serverless-better-credentials/commit/aff949d261b802008ac9a79fe0acceaadca85a84))
* sso credential resolution ([487a448](https://github.com/thomasmichaelwallace/serverless-better-credentials/commit/487a448164d1c76d2b7adab71ff943b9f6ebfb54))
* sso provider with prompt ([42abb9f](https://github.com/thomasmichaelwallace/serverless-better-credentials/commit/42abb9fbf0475abea7d220d72aa1bbce9aa7afbd))
