import { createContext, useContext, useState } from "react";
import ConfirmModal from "../components/ui/ConfirmModal";

const ConfirmContext = createContext();

export const useConfirm = () => useContext(ConfirmContext);

export const ConfirmProvider = ({ children }) => {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const showConfirm = ({ title, message, onConfirm }) => {
    setConfirmState({
      isOpen: true,
      title,
      message,
      onConfirm,
    });
  };

  const handleClose = () => setConfirmState((prev) => ({ ...prev, isOpen: false }));

  const handleConfirm = () => {
    if (confirmState.onConfirm) confirmState.onConfirm();
    handleClose();
  };

  return (
    <ConfirmContext.Provider value={{ showConfirm }}>
      {children}
      <ConfirmModal 
        isOpen={confirmState.isOpen} 
        onClose={handleClose} 
        onConfirm={handleConfirm}
        title={confirmState.title}
        message={confirmState.message}
      />
    </ConfirmContext.Provider>
  );
};
