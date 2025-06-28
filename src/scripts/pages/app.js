import routes from "../routes/routes"
import { getActiveRoute } from "../routes/url-parser"
import * as AuthModel from "../models/auth-model"

class App {
  #content = null
  #drawerButton = null
  #navigationDrawer = null
  #currentPage = null

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content
    this.#drawerButton = drawerButton
    this.#navigationDrawer = navigationDrawer

    this._setupDrawer()
    this._updateNavigation()

    // Setup skip to content setelah DOM ready
    this._initializeSkipToContent()
  }

  _initializeSkipToContent() {
    // Tunggu DOM ready jika belum
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        this._setupSkipToContent()
      })
    } else {
      this._setupSkipToContent()
    }
  }

  _setupSkipToContent() {
    const mainContent = document.querySelector("#main-content")
    const skipLink = document.querySelector(".skip-link")

    if (!skipLink || !mainContent) {
      console.warn("Skip to content elements not found")
      return
    }

    // Pastikan main content bisa di-focus
    if (!mainContent.hasAttribute("tabindex")) {
      mainContent.setAttribute("tabindex", "-1")
    }

    // Remove existing listener jika ada
    skipLink.removeEventListener("click", this._handleSkipToContent)

    // Add event listener dengan proper binding
    this._handleSkipToContent = this._handleSkipToContent.bind(this)
    skipLink.addEventListener("click", this._handleSkipToContent)
  }

  _handleSkipToContent(event) {
    event.preventDefault()

    const mainContent = document.querySelector("#main-content")
    const skipLink = event.target

    if (!mainContent) {
      console.warn("Main content not found")
      return
    }

    try {
      // Hilangkan fokus dari skip link
      skipLink.blur()

      // Fokus ke main content
      mainContent.focus()

      // Scroll ke main content dengan smooth behavior
      mainContent.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })

      // Announce ke screen reader (optional)
      this._announceToScreenReader("Navigated to main content")
    } catch (error) {
      console.error("Error in skip to content:", error)

      // Fallback: scroll manual jika focus gagal
      window.scrollTo({
        top: mainContent.offsetTop,
        behavior: "smooth",
      })
    }
  }

  _announceToScreenReader(message) {
    // Buat elemen tersembunyi untuk announce ke screen reader
    const announcement = document.createElement("div")
    announcement.setAttribute("aria-live", "polite")
    announcement.setAttribute("aria-atomic", "true")
    announcement.className = "sr-only"
    announcement.textContent = message

    document.body.appendChild(announcement)

    // Hapus setelah announce
    setTimeout(() => {
      if (announcement.parentNode) {
        announcement.parentNode.removeChild(announcement)
      }
    }, 1000)
  }

  _setupDrawer() {
    this.#drawerButton.addEventListener("click", () => {
      const isOpen = this.#navigationDrawer.classList.contains("open")
      this.#navigationDrawer.classList.toggle("open")
      this.#drawerButton.setAttribute("aria-expanded", !isOpen)
    })

    document.body.addEventListener("click", (event) => {
      if (!this.#navigationDrawer.contains(event.target) && !this.#drawerButton.contains(event.target)) {
        this.#navigationDrawer.classList.remove("open")
        this.#drawerButton.setAttribute("aria-expanded", "false")
      }

      this.#navigationDrawer.querySelectorAll("a").forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove("open")
          this.#drawerButton.setAttribute("aria-expanded", "false")
        }
      })
    })
  }

  _updateNavigation() {
    const navList = document.getElementById("nav-list")
    const authenticated = AuthModel.isAuthenticated()
    const userName = AuthModel.getUserName()

    if (authenticated) {
      navList.innerHTML = `
        <li><a href="#/"><i class="fas fa-home" aria-hidden="true"></i> Beranda</a></li>
        <li><a href="#/add-story"><i class="fas fa-plus-circle" aria-hidden="true"></i> Tambah Cerita</a></li>
        <li><a href="#/about"><i class="fas fa-info-circle" aria-hidden="true"></i> Tentang</a></li>
        <li class="nav-user">
          <span class="user-info">
            <i class="fas fa-user" aria-hidden="true"></i>
            ${userName || "User"}
          </span>
        </li>
        <li><button id="logout-btn" class="logout-btn"><i class="fas fa-sign-out-alt" aria-hidden="true"></i> Logout</button></li>
      `

      const logoutBtn = document.getElementById("logout-btn")
      if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
          if (confirm("Yakin ingin logout?")) {
            AuthModel.logout()
          }
        })
      }
    } else {
      navList.innerHTML = `
        <li><a href="#/"><i class="fas fa-home" aria-hidden="true"></i> Beranda</a></li>
        <li><a href="#/about"><i class="fas fa-info-circle" aria-hidden="true"></i> Tentang</a></li>
        <li><a href="#/login"><i class="fas fa-sign-in-alt" aria-hidden="true"></i> Masuk</a></li>
        <li><a href="#/register"><i class="fas fa-user-plus" aria-hidden="true"></i> Daftar</a></li>
      `
    }
  }

  async renderPage() {
    const url = getActiveRoute()
    const page = routes[url]


    if (this.#currentPage && typeof this.#currentPage.cleanup === "function") {
      this.#currentPage.cleanup()
    }


    this._updateNavigation()


    if (url === "/add-story" && !AuthModel.isAuthenticated()) {
      window.location.hash = "#/login"
      return
    }

    if (!page) {
      this.#content.innerHTML = `
        <div class="error-page">
          <h1>404 - Halaman Tidak Ditemukan</h1>
          <p>Halaman yang Anda cari tidak tersedia.</p>
          <a href="#/" class="btn btn-primary">Kembali ke Beranda</a>
        </div>
      `
      return
    }


    this.#currentPage = page


    if ("startViewTransition" in document) {
      document.startViewTransition(async () => {
        this.#content.innerHTML = await page.render()
        await page.afterRender()


        this._setupSkipToContent()
      })
    } else {

      this.#content.style.opacity = "0"
      setTimeout(async () => {
        this.#content.innerHTML = await page.render()
        await page.afterRender()
        this.#content.style.opacity = "1"


        this._setupSkipToContent()
      }, 150)
    }
  }
}

export default App
