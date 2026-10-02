import { useState } from 'react';

export const useEventoModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [event, setEvent] = useState(null);
  const [initialDate, setInitialDate] = useState('');

  const openForCreate = (date = '') => {
    setEvent(null);
    setInitialDate(date);
    setIsOpen(true);
  };

  const openForEdit = (selectedEvent) => {
    setEvent(selectedEvent);
    setInitialDate(selectedEvent.date);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setEvent(null);
    setInitialDate('');
  };

  return { isOpen, event, initialDate, openForCreate, openForEdit, close };
};