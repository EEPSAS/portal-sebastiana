import { useState } from 'react';

export const useEventoModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [eventBeingEdited, setEventBeingEdited] = useState(null);
  const [initialDate, setInitialDate] = useState(null);

  const openNewEvent = (date) => {
    setEventBeingEdited(null);
    setInitialDate(date);
    setIsOpen(true);
  };

  const openEditEvent = (event) => {
    setEventBeingEdited(event);
    setInitialDate(null);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setEventBeingEdited(null);
    setInitialDate(null);
  };

  return { isOpen, eventBeingEdited, initialDate, openNewEvent, openEditEvent, close };
};