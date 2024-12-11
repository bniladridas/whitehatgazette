import React, { useEffect } from 'react';

const Modal = ({ src, closeModal }) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Backspace') {
        closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeModal]);

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-4 rounded">
        <button
          className="absolute top-0 right-0 p-2 bg-red-500 text-white rounded"
          onClick={closeModal}
        >
          X
        </button>
        <img src={src} alt="Modal Content" className="w-auto h-auto max-w-full max-h-full" />
      </div>
    </div>
  );
};

export default Modal;
