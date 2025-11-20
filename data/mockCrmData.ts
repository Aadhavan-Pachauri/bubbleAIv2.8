// data/mockCrmData.ts

export const kpiData = [
  { title: "Revenue", value: "$405,091.00", change: "+4.75%", positive: true },
  { title: "Overdue invoices", value: "$12,787.00", change: "+54.02%", positive: false },
  { title: "Outstanding invoices", value: "$245,988.00", change: "-1.39%", positive: false },
  { title: "Expenses", value: "$30,156.00", change: "+10.18%", positive: false },
];

export const salesData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  datasets: [
    {
      label: "This year",
      data: [18, 16, 22, 28, 35, 30, 38, 36, 42, 48, 55, 50],
      borderColor: "#6366f1",
      tension: 0.4,
    },
    {
      label: "Last year",
      data: [12, 14, 18, 24, 30, 28, 32, 30, 35, 40, 48, 45],
      borderColor: "#a5b4fc",
      borderDash: [5, 5],
      tension: 0.4,
    },
  ],
};

export const customersData = [
  { name: "Jane Cooper", email: "jane.cooper@example.com", company: "Microsoft", status: "Active", lastActivity: "5m ago" },
  { name: "Cody Fisher", email: "cody.fisher@example.com", company: "Tesla", status: "Active", lastActivity: "2h ago" },
  { name: "Esther Howard", email: "esther.howard@example.com", company: "Apple", status: "Inactive", lastActivity: "1d ago" },
  { name: "Jenny Wilson", email: "jenny.wilson@example.com", company: "Nvidia", status: "Active", lastActivity: "3d ago" },
  { name: "Kristin Watson", email: "kristin.watson@example.com", company: "Meta", status: "Inactive", lastActivity: "7d ago" },
  { name: "Cameron Williamson", email: "cameron.williamson@example.com", company: "Google", status: "Active", lastActivity: "1m ago" },
];
