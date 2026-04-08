import logoTransparent from '@/assets/logo-transparent.png';

export function Watermark() {
  return (
    <div className="watermark inset-0 flex items-center justify-center overflow-hidden">
      <img src={logoTransparent} alt="" className="w-[500px] max-w-[80vw]" />
    </div>
  );
}
