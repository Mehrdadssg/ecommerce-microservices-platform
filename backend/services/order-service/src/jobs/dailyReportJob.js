// generate daily sales report and analytics
import { CronJob } from 'cron';
import {Order} from '../models/order.model.js';
import {emailService} from '../../../email-service/emailService.js';


class  DailyReportJob{

}