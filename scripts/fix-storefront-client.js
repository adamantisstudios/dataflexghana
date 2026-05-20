const fs = require("fs")
const path = "app/public-agent-sandbox/[agentId]/storefront-client.tsx"
let c = fs.readFileSync(path, "utf8")

c = c.replace(
  /(\{servicePagination\.items\.map\([\s\S]*?\)\)\}\s*)<\/div>\s*\)\}\s*<StorefrontListPagination/,
  "$1</StorefrontPageSection>\n                  <StorefrontListPagination",
)

fs.writeFileSync(path, c)
console.log("fixed services closing")
