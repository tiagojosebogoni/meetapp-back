import * as Yup from 'yup';
import { Op } from 'sequelize';
import { isBefore, parseISO, startOfDay, endOfDay } from 'date-fns';
import Meetup from '../models/Meetup';
import User from '../models/User';

class MeetupController {
  async index(req, res) {
    const page = req.query.page || 1;

    const dateFormatted = parseISO(req.query.date);

    const meetups = await Meetup.findAll({
      where: {
        date: {
          [Op.between]: [startOfDay(dateFormatted), endOfDay(dateFormatted)],
        },
      },
      include: {
        model: User,
        attributes: ['id', 'name', 'email'],
      },
      limit: 10,
      offset: 10 * page - 10,
    });

    return res.json(meetups);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string(),
      file_id: Yup.number(),
      description: Yup.string(),
      location: Yup.string(),
      date: Yup.date(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Campos Obrigatórios' });
    }

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
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      file_id: Yup.number().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Campos obrigatórios' });
    }
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
