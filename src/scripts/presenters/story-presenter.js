class StoryPresenter {
  constructor(view, storyModel, authModel) {
    this.view = view
    this.storyModel = storyModel
    this.authModel = authModel
  }

  async loadStories() {
    try {
      this.view.showLoading()
      const token = this.authModel.getAuthToken()
      const response = await this.storyModel.getStories(token)
      if (response.error === false && response.listStory) {
        this.view.displayStories(response.listStory)
      } else {
        this.view.showError("Gagal memuat cerita")
      }
    } catch (error) {
      this.view.showError("Terjadi kesalahan saat memuat cerita")
    } finally {
      this.view.hideLoading()
    }
  }

  async submitStory(storyData) {
    try {
      this.view.showLoading()
      const token = this.authModel.getAuthToken()

      const formData = new FormData()
      formData.append("description", storyData.description)
      formData.append("photo", storyData.photo)
      formData.append("lat", storyData.lat)
      formData.append("lon", storyData.lon)

      const response = await this.storyModel.addStory(formData, token)
      if (response.error === false) {
        this.view.showSuccess("Cerita berhasil ditambahkan!")
        return true
      } else {
        this.view.showError(response.message || "Gagal menambahkan cerita")
        return false
      }
    } catch (error) {
      this.view.showError("Terjadi kesalahan saat menambahkan cerita")
      return false
    } finally {
      this.view.hideLoading()
    }
  }
}

export default StoryPresenter
