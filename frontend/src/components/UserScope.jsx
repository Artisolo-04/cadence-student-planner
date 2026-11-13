import { Fragment, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

// Remounts everything below when the signed-in user changes,
// so no in-memory state from the previous account can survive.
export default function UserScope({ children }) {
  const auth = useContext(AuthContext);
  return <Fragment key={auth?.user?.id ?? "anon"}>{children}</Fragment>;
}
