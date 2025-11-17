const ProfileSkeleton = () => {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-10 rounded-xl bg-neutral-200 animate-pulse"
        />
      ))}
    </div>
  );
}
export default ProfileSkeleton;