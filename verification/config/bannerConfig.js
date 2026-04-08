export const BANNER_CONFIG = {
  headlineTemplate: "{{documentType}} | {{primaryChip}} | {{secondaryChip}} | {{statusChip}}",
  chipColors: {
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    green: "bg-green-100 text-green-800 border-green-200",
    orange: "bg-orange-100 text-orange-800 border-orange-200",
    purple: "bg-purple-100 text-purple-800 border-purple-200",
    teal: "bg-teal-100 text-teal-800 border-teal-200",
    indigo: "bg-indigo-100 text-indigo-800 border-indigo-200",
    red: "bg-red-100 text-red-800 border-red-200",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200"
  },
  priorityOrder: [
    "TIN",
    "License Number",
    "Registration Number",
    "Plate Number",
    "Expiry Date",
    "Amount",
    "Name",
    "Status"
  ],
  maxChips: 5,
  icons: {
    TIN: "🔢",
    License: "📋",
    Expiry: "⏰",
    Amount: "💰",
    Name: "👤",
    Plate: "🚗",
    Stamp: "🖊️",
    Grade: "🏅",
    Status: "⚡",
    Warning: "⚠️",
    Error: "❌",
    Success: "✅"
  }
}

export default BANNER_CONFIG
