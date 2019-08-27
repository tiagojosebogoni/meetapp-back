import Subscription from '../models/Subscription';
import Meetup from '../models/Meetup';

class OrganizingController {
  async index(req, res) {
    /**
     * Crie uma rota para listar os meetups em que o usuário logado está inscrito.
     * Liste apenas meetups que ainda não passaram e ordene meetups mais próximos como primeiros da lista.
     */
    const user_id = req.userId;

    /* const subscription = await Subscription.findAll({
      where: {
        user_id,
      },
      include: [
        {
          model: Meetup,
          attributes: ['id', 'title', 'date'],
        },
      ],
      order: [['id', 'desc']],
    });
*/

    const subscription = await Meetup.findAll({
      order: [['date', 'asc']],
      include: [
        {
          model: Subscription,
          where: { user_id },
          attributes: ['id'],
        },
      ],
      attributes: ['id', 'title', 'date'],
    });

    return res.json(subscription);
  }
}

export default new OrganizingController();
