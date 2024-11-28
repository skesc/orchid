import {Link} from "@tanstack/react-router";
import {LogIn, LogOut} from "lucide-react";
import React from "react";
import {useAuth} from "../contexts/AuthContext";

const ProfileSection = () => {
  const {user} = useAuth();
  const [imageError, setImageError] = React.useState(false);

  const initials = React.useMemo(() => {
    if (!user?.name) return "";
    return user.name
      .split(" ")
      .map((n) => n.slice(0, 2))
      .join("")
      .toUpperCase();
  }, [user?.name]);

  const handleImageError = () => {
    setImageError(true);
  };

  React.useEffect(() => {
    setImageError(false);
  }, [user?.name]);

  const renderAvatar = () => {
    if (!user?.name) {
      return (
        <Link to="/login" className="group flex flex-col items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-neutral-700 flex items-center justify-center">
            <LogIn size={16} className="text-neutral-300" />
          </div>
          <span className="text-xs text-neutral-400 group-hover:text-violet-400 transition">Login</span>
        </Link>
      );
    }

    if (imageError) {
      return <div className="h-8 w-8 flex items-center justify-center rounded-full bg-neutral-500 text-white text-sm">{initials}</div>;
    }

    return <img src={`https://sakura.rex.wf/linear/${user.name}?text=${initials}`} alt={user.name} className="h-8 w-8 rounded-full object-cover" onError={handleImageError} />;
  };

  return (
    <div className="w-full h-full flex flex-col items-center py-4 bg-neutral-900">
      <div className="group flex gap-5 flex-col items-center">
        {renderAvatar()}

        {user && (
          <>
            <Link to="/logout" className="text-neutral-400 hover:text-violet-400 transition flex flex-col items-center gap-1">
              <LogOut size={20} />
              <span className="text-xs">Logout</span>
            </Link>
            <div className="py-[1px] px-3 bg-neutral-700 w-full"></div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileSection;
