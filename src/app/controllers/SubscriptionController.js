import pt from 'date-fns/locale/pt';
import { fn, col } from 'sequelize';
import { format } from 'date-fns';
import Meetup from '../models/Meetup';
import Subscription from '../models/Subscription';
import User from '../models/User';
import Mail from '../../lib/Mail';

class SubscriptionController {
  async index(req, res) {
    // const meetups = await Meetup.find;
    return res.json('meetups');
  }

  async store(req, res) {
    const user_id = req.userId;
    const meetup_id = req.params.meetupId;
    const meetup = await Meetup.findByPk(meetup_id, {
      include: [
        {
          model: User,
          attributes: ['name', 'email'],
        },
      ],
    });

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
    const checkDate = await Subscription.findOne({
      where: { user_id },
      include: [
        {
          model: Meetup,
          where: { date: meetup.date },
        },
      ],
    });

    if (checkDate) {
      return res.status(400).json({
        error: `Você já está inscrito no evento de ${checkDate.Meetup.title}, neste horário`,
      });
    }

    /* const subscription = await Subscription.create({
      user_id,
      meetup_id,
    });
*/
    /**
     * Sempre que um usuário se inscrever no meetup, envie um e-mail ao organizador contendo os dados relacionados ao usuário inscrito.
     */
    const formattedDate = format(
      meetup.date,
      "'no' 'dia' dd 'de' MMMM', às' H:mm'h'",
      { locale: pt }
    );
    const user = await User.findByPk(user_id);

    const count = await Subscription.count({
      where: { meetup_id },
      attributes: [[fn('count', col('meetup_id')), 'meetup']],
    });

    await Mail.sendMail({
      to: `${meetup.User.name} <${meetup.User.email}>`,
      subject: `Nova Inscrição no Meetup de ${meetup.title}, ${formattedDate}`,
      // text: `Uma nova inscrição de ${user.name}`,
      template: 'send',
      context: {
        speaker: meetup.User.name,
        user: user.name,
        count,
        img: 'meetapp.svg',
      },
    });

    return res.json('subscription');
  }
}

export default new SubscriptionController();
