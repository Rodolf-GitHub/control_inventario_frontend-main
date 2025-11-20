import { toast as baseToast } from '@/hooks/use-toast';

interface ToastHelperOptions {
  title: string;
  description?: string;
}

export function toastSuccess(options: ToastHelperOptions) {
  const t = baseToast({
    ...options,
    className: 'bg-green-50 border-green-200 text-green-900 dark:bg-green-950/30 dark:border-green-800 dark:text-green-100',
  });
  setTimeout(() => t.dismiss(), 1000);
  return t;
}

export function toastError(options: ToastHelperOptions | Error | unknown) {
  let title = 'Error';
  let description = 'Ocurrió un error';
  
  if (options instanceof Error) {
    description = options.message;
  } else if (typeof options === 'object' && options !== null && 'title' in options) {
    title = (options as ToastHelperOptions).title;
    description = (options as ToastHelperOptions).description || description;
  }

  const t = baseToast({
    title,
    description,
    variant: 'destructive',
    className: 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/30 dark:border-red-800 dark:text-red-100',
  });
  setTimeout(() => t.dismiss(), 1000);
  return t;
}
