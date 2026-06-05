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
