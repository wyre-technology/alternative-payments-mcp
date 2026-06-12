## [1.0.2](https://github.com/wyre-technology/alternative-payments-mcp/compare/v1.0.1...v1.0.2) (2026-06-12)


### Bug Fixes

* **docker:** remove npm CLI from production image to clear Trivy base-image CVEs ([18b1b07](https://github.com/wyre-technology/alternative-payments-mcp/commit/18b1b07c6b0c3358cc9a82524c9e139db8dff20e))

## [1.0.1](https://github.com/wyre-technology/alternative-payments-mcp/compare/v1.0.0...v1.0.1) (2026-06-05)


### Bug Fixes

* shorten server.json description to satisfy MCP Registry 100-char limit ([1e95e52](https://github.com/wyre-technology/alternative-payments-mcp/commit/1e95e5292eaa615e791c10985f64c276429007c8))

# 1.0.0 (2026-06-05)


### Features

* initial Alternative Payments MCP server ([b78ac53](https://github.com/wyre-technology/alternative-payments-mcp/commit/b78ac5369733e3200ffbda32fb723160f64a0626))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial release of the Alternative Payments MCP server.
- Read tools for customers, invoices, transactions, payouts, payment requests,
  and webhook subscriptions/events.
- Safe-write tools: create customer/customer-user, create invoice, create hosted
  payment request, create/retry webhooks.
- Destructive tools gated behind elicitation confirmation: archive customer,
  archive invoice, delete webhook.
- Decision-tree navigation (`ap_navigate`, `ap_status`).
- Stateless per-request HTTP transport for gateway hosting + stdio transport.
- Intentionally omits direct payment creation (no money movement).
