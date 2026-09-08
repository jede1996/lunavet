import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Registrar plugins requeridos de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function WeightChart({ records = [] }) {
  if (!records || records.length === 0) {
    return (
      <div className="alert alert-light text-center py-4 border">
        <i className="bi bi-graph-up text-muted fs-3 mb-2 d-block"></i>
        <p className="text-muted small mb-0">No hay registros de peso corporal registrados aún.</p>
      </div>
    );
  }

  // Ordenar registros por fecha
  const sorted = [...records].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  const labels = sorted.map(r => {
    const d = new Date(r.fecha);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  });

  const dataValues = sorted.map(r => parseFloat(r.peso_kg));

  const data = {
    labels,
    datasets: [
      {
        label: 'Peso (kg)',
        data: dataValues,
        fill: true,
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        tension: 0.35,
        pointBackgroundColor: '#0284c7',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => `Peso: ${context.parsed.y} kg`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Kilogramos (kg)'
        },
        grid: {
          color: 'rgba(226, 232, 240, 0.6)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div style={{ height: '260px', width: '100%' }}>
      <Line data={data} options={options} />
    </div>
  );
}
