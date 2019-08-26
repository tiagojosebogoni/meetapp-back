import { isBefore, parseISO } from 'date-fns';
import Meetup from '../models/Meetup';

class MeetupController {
  async index(req, res) {
    const user_id = req.userId;
    const meetups = await Meetup.findAll({
      where: {
        user_id,
      },
    });

    return res.json(meetups);
  }

  async update(req, res) {
    const { id } = req.params;
    const user_id = req.userId;

    const meetup = await Meetup.findOne({
      where: {
        id,
        user_id,
      },
    });

    if (!meetup) {
      return res.status(401).json({ error: 'Sem permissão' });
    }

    const dateBefore = isBefore(parseISO(req.body.date), new Date());
    if (dateBefore) {
      return res
        .status(401)
        .json({ error: 'Não é alterar Meetup que já aconteceram' });
    }

    meetup.update(req.body);

    return res.json(meetup);
  }

  async store(req, res) {
    const user_id = req.userId;

    const dateBefore = isBefore(parseISO(req.body.date), new Date());

    if (dateBefore) {
      return res
        .status(401)
        .json({ error: 'Não é agendar Meetup com data anterior' });
    }

    const meetup = await Meetup.create({
      ...req.body,
      user_id,
    });

    return res.json(meetup);
  }

  async delete(req, res) {
    const { id } = req.params;
    const user_id = req.userId;

    const meetup = await Meetup.findOne({
      where: {
        id,
        user_id,
      },
    });

    if (!meetup) {
      return res.status(401).json({ error: 'Sem permissão' });
    }

    const dateBefore = isBefore(parseISO(req.body.date), new Date());
    if (dateBefore) {
      return res.status(401).json({
        error: 'Não é possível alterar esse Meetup. Já foi realizado.',
      });
    }

    meetup.destroy();

    return res.send();
  }
}

export default new MeetupController();
