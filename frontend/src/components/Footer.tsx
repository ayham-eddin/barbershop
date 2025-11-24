import clsx from "clsx";

interface FooterProps {
  className?: string;
  children: React.ReactNode;
}

const Footer: React.FC<FooterProps> = ({ className, children }) => {
  return (
    <footer className={clsx("border-t border-neutral-200 mt-12 py-6 text-center text-sm text-neutral-500", className)}>
      <div className="flex flex-col items-center gap-2">
        {children}       
      </div>
    </footer>
  );
};

export default Footer;
