import { Icon } from "@iconify/react";
function Header() {
  return (
    <header>
      <h1>
        <Icon style={{ fontSize: 35 }} icon="game-icons:graduate-cap" />
        StudyMate
      </h1>
      <p id="head-caption">A Web-based Study Material Retrieval System</p>
      <nav>
        <a href="login.html">
          <Icon style={{ fontSize: 20 }} icon="material-symbols:logout" />{" "}
          LOGOUT
        </a>
      </nav>
    </header>
  );
}
export default Header;
