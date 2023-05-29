import fetch from 'node-fetch'

export const requireLogin = (req, res, next) => {
  if (!req.session.user) return res.redirect('/login')
  next()
}

export const isAllowed = async (req, res, next) => {
  let result, id, coffeeshop

  try {
    id = req.params.id
    result = await fetch(`http://${req.get('host')}/api/v1/coffeeshops/${id}`)
    coffeeshop = await result.json()
    coffeeshop = coffeeshop.coffeeshop
  } catch (e) {
    console.error('problem finding the coffeeshop')
    return res.redirect('/coffeeshops')
  }

  if (req.session.user._id !== coffeeshop.author)
    return res.redirect('/coffeeshops')
  next()
}
