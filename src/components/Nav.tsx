import { LinkNav } from "./LinkNav";
import NotificationBell from "./NotificationBell";

const Nav = () => {
  return (
    <div
      className={`nav fixed left-0 z-[1000] w-full flex justify-center transition-ui top-[2%]`}
    >
      <div className="wrapper rounded-2xl w-full space-between flex w-[100%] justify-between transition-ui">
        {/* <div className="nav-left mx-2 flex justify-center items-center ">
          <div className="nav-brand w-max text-2xl font-bold color-primary px-3 py-2 nav-block font-primary">
            <KineticText text="SkillHive" />
          </div>
        </div> */}
        {/* <div className="nav-skill-search-box relative w-auto flex items-center">
                    <input type="text" value={text} onChange={(e) => setText(e.target.value)} onBlur={() => setText("")} placeholder='Explore...' className="search-box select-none w-10.25 text-transparent focus:text-white placeholder-transparent focus:placeholder-grey-100 focus:w-50 transition-ui border-1 border-white/10   outline-0 bg-white/5 hover:bg-white/15 cursor-pointer focus:bg-white/15 rounded-full px-3 py-2" />
                    <i className='fa fa-search absolute right-2.75 pointer-events-none'></i>
                </div> */}
        <div className="nav-center w-full flex justify-center items-center gap-2 transition-ui">
          <LinkNav />
          {/* <NotificationBell /> */}
        </div>
        {/* <div className="nav-right flex justify-end items-center mx-5">
          <div className="profile-btn w-35 hover:scale-[1.05] active:scale-[1.015] transition-ui">
            <img src={IOS} className="w-full" alt="this is it" />
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default Nav;
