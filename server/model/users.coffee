exports.middleware =
  check_app_access: (req, res, next) ->
    if !req.user
      res.sendStatus 403
      return

    # Admins always have access
    if req.user.admin
      next()
      return

    if !req.user.apps || req.user.apps.indexOf(req.params.app_id) == -1
      res.status(403).send('You don\'t have access to this app')
    else
      next()
