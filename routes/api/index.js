const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')

const MemberModel = require('../../models/member');
const TransactionModel = require('../../models/transaction');

router.get('/aye', (req, res) => {
    res.send('aye aye');
});

router.get('/members', (req, res) => {
    MemberModel
        .find({})
        .sort({number: 1})
        .then(members => {
            const mappedMembers = members.map(member => {
                return {
                    id: member._id,
                    first_name: member.first_name,
                    last_name: member.last_name,
                    number: member.number
                };
            });
            res.json(mappedMembers);
        })
        .catch(err => {
            console.error(err)
            res.status(400).send('Error');
        });
});

router.get('/members/:id', (req, res) => {
    MemberModel
        .findOne({ _id: req.params.id })
        .then(member => {
            if (member) {
                res.json({
                    id: member._id,
                    first_name: member.first_name,
                    last_name: member.last_name,
                    number: member.number
                });
            } else {
                res.status(404).send('Not found')
            }
        })
        .catch(err => {
            console.error(err)
            res.status(400).send('Error');
        });
});

router.get('/members/:id/transactions', (req, res) => {
    TransactionModel
        .find({ member: req.params.id })
        .sort({ date: -1 })
        .then(transactions => {
            const mappedTransactions = transactions.map(transaction => ({
                id: transaction._id,
                amount: transaction.amount,
                type: transaction.type,
                member: transaction.member,
                date: transaction.date
            }))

            res.json(mappedTransactions);
        })
        .catch(err => {
            console.error(err)
            res.status(400).send('Error');
        });
});

router.get('/members/:id/transactions/graph', (req, res) => {
    const group = aggregation => aggregation
        .match({ member: mongoose.Types.ObjectId(req.params.id) })
        .group({
            _id: { year: { $year: '$date' }, month: { $month: '$date' }},
            count: { $sum: '$amount'}
        })

    const getIncomes = group(
        TransactionModel
        .aggregate()
        .match({ type: 'income' })
    )
    const getExpense = group(
        TransactionModel
        .aggregate()
        .match({ type: 'expense' })
    )

    Promise.all([ getIncomes, getExpense])
        .then(([income, expense]) => {
            res.json({
                income,
                expense,
            });
        })
        .catch(err => {
            console.error(err)
            res.status(400).send('Error');
        });
});

module.exports = router;
