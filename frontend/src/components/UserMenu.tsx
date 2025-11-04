const UserMenu = ({ onLogout, onConfig }: { onLogout: () => void; onConfig: () => void }) => {
  return (
    <div className="fixed right-6 top-20 w-56 bg-(--color-fondo-claro) rounded-2xl shadow-2xl border border-(--color-vino-claro) z-50 animate-fade-in">
      <ul className="py-2">
        <li>
          <button onClick={onConfig} className="w-full text-left px-4 py-3 hover:bg-(--color-vino)/10 rounded-xl text-(--color-vino) font-semibold">Configuración</button>
        </li>
        <li>
          <button onClick={onLogout} className="w-full text-left px-4 py-3 hover:bg-(--color-rojo)/10 rounded-xl text-(--color-rojo) font-semibold">Cerrar sesión</button>
        </li>
      </ul>
    </div>
  );
};

export default UserMenu;
