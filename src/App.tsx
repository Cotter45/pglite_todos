import { Outlet } from "react-router-dom";

import { ApplicationLayout } from "./components/application-layout";

function App() {
  return (
    <ApplicationLayout>
      <Outlet />
    </ApplicationLayout>
  );
}

export default App;
