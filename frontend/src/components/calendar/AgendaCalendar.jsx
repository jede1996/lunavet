import React, { useEffect, useRef } from 'react';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

// Mapear citas del backend a eventos de FullCalendar
function mapAppointmentsToEvents(apts) {
  return (apts || []).map(apt => {
    let color = '#0284c7'; // default azul
    if (apt.estado === 'pendiente') color = '#f59e0b';
    if (apt.estado === 'en_curso' || apt.estado === 'atendiendo') color = '#7c3aed';
    if (apt.estado === 'completada') color = '#10b981';
    if (apt.estado === 'cancelada') color = '#ef4444';
    if (apt.estado === 'no_asistio') color = '#64748b';

    const petName = apt.mascota_nombre || apt.mascota?.nombre || 'Paciente';
    const serviceName = apt.servicio_nombre || apt.servicio?.nombre || 'Consulta';

    return {
      id: String(apt.id),
      title: `${petName} - ${serviceName}`,
      start: apt.fecha_hora_inicio || apt.fecha_hora,
      end: apt.fecha_hora_fin,
      backgroundColor: color,
      borderColor: color,
      textColor: '#ffffff',
      extendedProps: {
        appointment: apt
      }
    };
  });
}

export function AgendaCalendar({ appointments = [], onEventClick, onDateSelect }) {
  const calendarRef = useRef(null);
  const calendarInstanceRef = useRef(null);
  const onEventClickRef = useRef(onEventClick);
  const onDateSelectRef = useRef(onDateSelect);

  useEffect(() => {
    onEventClickRef.current = onEventClick;
    onDateSelectRef.current = onDateSelect;
  }, [onEventClick, onDateSelect]);

  useEffect(() => {
    if (!calendarRef.current) return;

    const calendar = new Calendar(calendarRef.current, {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: 'timeGridWeek',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      buttonText: {
        today: 'Hoy',
        month: 'Mes',
        week: 'Semana',
        day: 'Día'
      },
      locale: 'es',
      slotMinTime: '08:00:00',
      slotMaxTime: '20:00:00',
      allDaySlot: false,
      slotDuration: '00:30:00',
      weekends: true,
      nowIndicator: true,
      events: [],
      eventClick: (info) => {
        onEventClickRef.current?.(info.event.extendedProps.appointment);
      },
      select: (info) => {
        onDateSelectRef.current?.(info);
      },
      selectable: true,
      height: 'auto'
    });

    calendar.render();
    calendarInstanceRef.current = calendar;

    return () => {
      calendar.destroy();
      calendarInstanceRef.current = null;
    };
  }, []);

  // Actualizar eventos dinámicamente si appointments cambia
  useEffect(() => {
    if (calendarInstanceRef.current) {
      calendarInstanceRef.current.removeAllEvents();
      const newEvents = mapAppointmentsToEvents(appointments);
      newEvents.forEach(evt => calendarInstanceRef.current.addEvent(evt));
    }
  }, [appointments]);

  return (
    <div className="card shadow-sm border-0 rounded-4 p-3 bg-white">
      <div ref={calendarRef} />
    </div>
  );
}
