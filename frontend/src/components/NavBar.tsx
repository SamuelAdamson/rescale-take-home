import { type ReactElement } from 'react';
import { Link, NavLink } from 'react-router-dom';
import logo from '../assets/rescale.png';

export default function NavBar(): ReactElement {
  return (
    <nav className="bg-[var(--color-nav-bg)]">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="Home" className="h-10 w-auto brightness-60" />
        </Link>
        <div className="flex items-center gap-6">
          <NavLink
            to="/jobs"
            className="nav-link text-base font-semibold text-[var(--color-text-nav)] hover:text-[var(--color-text-nav-hover)] transition-colors"
          >
            Jobs
          </NavLink>
          <a
            href="https://github.com/SamuelAdamson/rescale-take-home/blob/main/README.md"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link-external text-base font-semibold"
          >
            Documentation
          </a>
        </div>
      </div>
    </nav>
  );
}
