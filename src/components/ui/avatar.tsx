import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, onError, src, ...props }, ref) => {
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    if (src) setFailed(false);
  }, [src]);

  // Se o src estiver vazio ou falhar, o AvatarPrimitive.Fallback assume.
  // Não retornamos null aqui para permitir que o Fallback funcione nativamente.
  return (
    <AvatarPrimitive.Image
      ref={ref}
      src={src}
      referrerPolicy="no-referrer"
      className={cn("aspect-square h-full w-full object-cover", className, (failed || !src) && "hidden")}
      onError={(event) => {
        console.error("Avatar failed to load:", src);
        setFailed(true);
        onError?.(event);
      }}
      {...props}
    />
  );
});
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
