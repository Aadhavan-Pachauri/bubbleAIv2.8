import React, { useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { kpiData, salesData, customersData } from '../../data/mockCrmData';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const KpiCard: React.FC<{ title: string; value: string; change: string; positive: boolean }> = ({ title, value, change, positive }) => (
    <div className="bg-bg-secondary p-6 rounded-xl border border-border-color">
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-3xl font-bold text-white mt-1">{value}</p>
        <div className={`mt-2 flex items-center text-sm ${positive ? 'text-green-400' : 'text-red-400'}`}>
            {positive ? <ArrowUpIcon className="w-4 h-4 mr-1" /> : <ArrowDownIcon className="w-4 h-4 mr-1" />}
            <span>{change} from last month</span>
        </div>
    </div>
);

const SalesChart: React.FC = () => {
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: { color: '#9ca3af' }
            },
        },
        scales: {
            x: { 
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: '#9ca3af' }
            },
            y: { 
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: '#9ca3af' }
            },
        },
    };
    return (
        <div className="bg-bg-secondary p-6 rounded-xl border border-border-color h-96">
            <h3 className="text-lg font-semibold text-white mb-4">Sales Performance</h3>
            <Line options={options} data={salesData} />
        </div>
    );
};

const CustomersTable: React.FC = () => (
    <div className="bg-bg-secondary p-6 rounded-xl border border-border-color overflow-x-auto">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Customers</h3>
        <table className="w-full text-sm text-left text-gray-400">
            <thead className="text-xs text-gray-400 uppercase bg-bg-tertiary/50">
                <tr>
                    <th scope="col" className="px-6 py-3">Name</th>
                    <th scope="col" className="px-6 py-3">Company</th>
                    <th scope="col" className="px-6 py-3">Status</th>
                    <th scope="col" className="px-6 py-3">Last Activity</th>
                </tr>
            </thead>
            <tbody>
                {customersData.map((customer, index) => (
                    <tr key={index} className="border-b border-border-color hover:bg-bg-tertiary">
                        <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">
                            <div className="flex flex-col">
                                <span>{customer.name}</span>
                                <span className="text-xs text-gray-500">{customer.email}</span>
                            </div>
                        </th>
                        <td className="px-6 py-4">{customer.company}</td>
                        <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                customer.status === 'Active' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'
                            }`}>
                                {customer.status}
                            </span>
                        </td>
                        <td className="px-6 py-4">{customer.lastActivity}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);


export const CrmDashboardPage: React.FC = () => {
  return (
    <div className="p-4 md:p-8 bg-bg-primary min-h-full text-white">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white">CRM Dashboard</h1>
        <p className="text-gray-400 mt-1">Welcome back, here's your business overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {kpiData.map(item => (
          <KpiCard key={item.title} {...item} />
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <SalesChart />
        </div>
        <div className="lg:col-span-1">
             <CustomersTable />
        </div>
      </div>
    </div>
  );
};
