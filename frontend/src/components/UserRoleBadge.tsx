const UserRoleBadge = ({ role }: { role: 'user' | 'admin' }) => {
  const cls =
    role === 'admin'
      ? 'bg-purple-100 text-purple-800 border-purple-200'
      : 'bg-neutral-100 text-neutral-700 border-neutral-200';
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {role}
    </span>
  );
}

export default UserRoleBadge;
