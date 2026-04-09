import { NavLink } from 'react-router';

const Nav = () => {
    return (
        <div className="nav fixed bottom-4 left-0 w-full flex justify-center">
            <div className="wrapper rounded-2xl flex p-1 bg-white/10  justify-center">
                <div className="nav-left  flex justify-start items-center">
                    <div className="nav-brand text-2xl font-bold ml-2 mr-2 text-[#fffd01]">
                        <img alt="" />
                        SkillHive
                    </div>
                    <div className="nav-skill-search-box relative w-auto flex items-center">
                        <input type="text" placeholder='Explore...' className="search-box w-9.5 text-transparent focus:text-white placeholder-transparent focus:placeholder-grey-100 focus:w-50 transition-ui border-1 border-white/10   outline-0 bg-white/5 focus:bg-white/15 rounded-full px-3 py-2" />
                        <i className='fa fa-search absolute right-2.5 pointer-events-none'></i>
                    </div>
                </div>
                <div className="nav-center  flex justify-center">
                    <div className="nav-links flex items-center justify-center">
                        <NavLink viewTransition to="/home" className={`nav-link font-lg mx-3`}>
                            <i className="fa-regular fa-home text-white text-xl hover:text-[#fffd01] transition-ui"></i>
                        </NavLink>
                        <NavLink to="/learn" className="nav-link font-lg mx-3">
                            <i className="fa-solid fa-brain text-white text-xl hover:text-[#fffd01] transition-ui"></i>
                        </NavLink>
                        <NavLink to="/chat" className="nav-link font-lg mx-3">
                            <i className="fa-regular fa-comment-dots text-white text-xl hover:text-[#fffd01] transition-ui"></i>
                        </NavLink>
                        <a className="nav-link font-lg mx-3">
                            <i className="fa-regular fa-bell text-white text-xl hover:text-[#fffd01] transition-ui"></i>
                        </a>
                    </div>
                </div>
                <div className="nav-right w-[25%] flex justify-end items-center">
                    <div className="profile-btn bg-white/10 px-3 py-2 rounded-2xl border-1 border-white/10">
                        TheLinuxGuy
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Nav;