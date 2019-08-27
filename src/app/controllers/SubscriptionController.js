import Meetup from '../models/Meetup';
import Subscription from '../models/Subscription';

class SubscriptionController {
  async index(req, res) {
    // const meetups = await Meetup.find;
    return res.json('meetups');
  }

  async store(req, res) {
    const user_id = req.userId;
    const meetup_id = req.params.meetupId;
    const meetup = await Meetup.findByPk(meetup_id);

    /**
     * O usuário deve poder se inscrever em meetups que não organiza.
     */
    if (meetup.user_id === req.userId) {
      return res
        .status(400)
        .json({ error: 'Não é possível se inscrever no mesmo meetup' });
    }

    /**
     * O usuário não pode se inscrever em meetups que já aconteceram.
     */
    if (meetup.past) {
      return res.json({
        error: 'Não é possível se inscrever em meetup passados',
      });
    }

    /**
     * O usuário não pode se inscrever no mesmo meetup duas vezes.
     */
    const registrations = await Subscription.findAll({
      where: { meetup_id, user_id },
    });

    const alreadySubscribed = registrations.length > 0;

    if (alreadySubscribed) {
      return res
        .status(400)
        .json({ error: 'Você já está inscrito neste Meetup' });
    }

    /**
     * O usuário não pode se inscrever em dois meetups que acontecem no mesmo horário.
     */

    const subscription = await Subscription.create({
      user_id,
      meetup_id,
    });

    return res.json(subscription);
  }
}

export default new SubscriptionController();
