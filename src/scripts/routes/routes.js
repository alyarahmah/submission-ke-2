import HomeView from "../views/home-view"
import AboutView from "../views/about-view"
import AddStoryView from "../views/add-story-view"
import LoginView from "../views/login-view"
import RegisterView from "../views/register-view"

const routes = {
  "/": new HomeView(),
  "/about": new AboutView(),
  "/add-story": new AddStoryView(),
  "/login": new LoginView(),
  "/register": new RegisterView(),
}

export default routes
