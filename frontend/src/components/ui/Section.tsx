import clsx from "clsx";

interface SectionProps {
  className?: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ className, children }) => {
  return (
    <section className={clsx("space-y-6", className)}>
      {children}
    </section>
  );
};

export default Section;
