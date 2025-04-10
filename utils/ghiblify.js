const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')
const path = require('path')

const ghiblifyImage = async (buffer) => {
  try {
    const imgbbForm = new FormData()
    imgbbForm.append('image', buffer.toString('base64'))

    const imgbbRes = await axios.post(
      `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
      imgbbForm,
      { headers: imgbbForm.getHeaders() }
    )

    const imageUrl = imgbbRes.data.data.url
    const falRes = await axios.post(
      'https://api.fal.ai/v1/predictions/fal-ai/ghiblify',
      {
        input: { image_url: imageUrl },
      },
      {
        headers: {
          Authorization: `Key ${process.env.FAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const statusUrl = falRes.data.urls.get
    let resultUrl = null

    for (let i = 0; i < 15; i++) {
      const statusRes = await axios.get(statusUrl, {
        headers: { Authorization: `Key ${process.env.FAL_API_KEY}` },
      })

      if (statusRes.data.status === 'succeeded') {
        resultUrl = statusRes.data.output.image_url
        break
      }

      await new Promise((res) => setTimeout(res, 2000))
    }

    return resultUrl || imageUrl
  } catch (err) {
    console.error('Error in ghiblifyImage:', err.message)
    return null
  }
}

module.exports = { ghiblifyImage }
