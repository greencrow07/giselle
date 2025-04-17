"use client";

import {
	Provider as ToastComponentProvider,
	Viewport as ToastComponentViewport,
} from "@radix-ui/react-toast";
import { createContext, useCallback, useContext, useState } from "react";

interface Toast {
	id: string;
	title?: string;
	message?: string;
	type?: "info" | "success" | "warning" | "error";
	duration?: number;
}

interface ToastContextType {
	toasts: Toast[];
	addToast: (toast: Omit<Toast, "id">) => void;
	removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error("useToast must be used within a ToastProvider");
	}
	return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const removeToast = useCallback((id: string) => {
		setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
	}, []);

	const addToast = useCallback(
		(toast: Omit<Toast, "id">) => {
			const id = Math.random().toString(36).substring(2);
			const newToast = {
				...toast,
				id,
				duration: toast.duration || 10000,
			};

			setToasts((prevToasts) => [...prevToasts, newToast]);

			setTimeout(() => {
				removeToast(id);
			}, newToast.duration);
		},
		[removeToast],
	);

	return (
		<ToastContext.Provider value={{ toasts, addToast, removeToast }}>
			<ToastComponentProvider swipeDirection="right">
				{children}
				<ToastComponentViewport className="fixed bottom-0 right-0 z-2147483647 m-0 flex w-[320px] max-w-[100vw] list-none flex-col gap-2.5 p-[40px] outline-hidden" />
			</ToastComponentProvider>
		</ToastContext.Provider>
	);
};
