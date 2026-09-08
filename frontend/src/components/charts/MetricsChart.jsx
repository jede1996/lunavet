import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export function RevenueChart({ paymentsByMethod = {} }) {
  const labels = Object.keys(paymentsByMethod).map(m => m.charAt(0).toUpperCase() + m.slice(1));
  const values = Object.values(paymentsByMethod);

  if (values.length === 0 || values.every(v => v === 0)) {
    return (
      <div className="text-center py-4 text-muted small">
        <i className="bi bi-wallet2 display-6 d-block mb-2 text-secondary"></i>
        Sin datos de transacciones en este período.
      </div>
    );
  }

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: [
          '#7c3aed', // Morado principal
          '#0284c7', // Azul secundario
          '#10b981', // Verde
          '#f59e0b'  // Ámbar
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          font: { size: 11 }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => ` $${parseFloat(context.raw).toFixed(2)}`
        }
      }
    }
  };

  return (
    <div style={{ height: '220px', width: '100%' }}>
      <Doughnut data={data} options={options} />
    </div>
  );
}

export function AppointmentsStatusChart({ countsByStatus = {} }) {
  const statusLabels = {
    pendiente: 'Pendiente',
    confirmada: 'Confirmada',
    en_curso: 'En Consulta',
    completada: 'Completada',
    cancelada: 'Cancelada',
    no_asistio: 'No Asistió'
  };

  const labels = Object.keys(countsByStatus).map(s => statusLabels[s] || s);
  const values = Object.values(countsByStatus);

  const data = {
    labels,
    datasets: [
      {
        label: 'Citas',
        data: values,
        backgroundColor: [
          'rgba(245, 158, 11, 0.7)',  // pendiente (ámbar)
          'rgba(2, 132, 199, 0.7)',   // confirmada (azul)
          'rgba(124, 58, 237, 0.7)',  // en curso (morado)
          'rgba(16, 185, 129, 0.7)',  // completada (verde)
          'rgba(239, 68, 68, 0.7)',   // cancelada (rojo)
          'rgba(100, 116, 139, 0.7)'  // no asistió (gris)
        ],
        borderRadius: 6
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
        grid: { color: 'rgba(226, 232, 240, 0.6)' }
      },
      x: {
        grid: { display: false }
      }
    }
  };

  return (
    <div style={{ height: '220px', width: '100%' }}>
      <Bar data={data} options={options} />
    </div>
  );
}
