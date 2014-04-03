'use strict';

var
    lab         = require('lab'),
    describe    = lab.describe,
    it          = lab.it,
    before      = lab.before,
    demand      = require('must'),
    Bot         = require('../lib/bot'),
    bunyan      = require('bunyan'),
    MockMessage = require('./mocks/message'),
    StatusCats  = require('../plugins/statuscats')
    ;

describe('Bot', function()
{
    var log;

    before(function(done)
    {
        log = bunyan.createLogger({ name: 'test', streams: [] });
        done();
    });

    describe('constructor', function()
    {
        it('requires an options object', function(done)
        {
            function shouldThrow() { return new Bot(); }
            shouldThrow.must.throw(/options object/);
            done();
        });

        it('requires a log option', function(done)
        {
            function shouldThrow() { return new Bot({}); }
            shouldThrow.must.throw(/bunyan logger/);
            done();
        });

        it('can be constructed', function(done)
        {
            var bot = new Bot({ log: log, botname: 'test' });
            done();
        });
    });

    describe('plugins', function()
    {
        it('are loaded on construction', function(done)
        {
            var opts =
            {
                botname: 'test',
                log: log,
                plugins: { statuscats: {} }
            };

            var bot = new Bot(opts);
            bot.must.have.property('plugins');
            bot.plugins.must.have.length(1);
            var plugin = bot.plugins[0];
            plugin.must.be.instanceof(StatusCats);
            done();
        });

    });

    describe('message handling', function()
    {
        var bot;

        before(function(done)
        {
            var opts =
            {
                botname: 'test',
                log: log,
                plugins: { statuscats: {} }
            };
            bot = new Bot(opts);
            done();
        });

        it('handleMessage() calls done', function(done)
        {
            var msg = new MockMessage({ text: 'foo'});
            msg.on('done', function()
            {
                done();
            });

            bot.handleMessage(msg);
        });

        it('ignores messages that do not match a plugin', function(done)
        {
            var msg = new MockMessage({ text: 'foo'});

            msg.on('send', function() { throw new Error('not supposed to reply!'); });
            msg.on('done', function() { done(); });

            bot.handleMessage(msg);
        });

        it('ignores messages that match its name but not a plugin', function(done)
        {
            var msg = new MockMessage({ text: 'test: not-valid' });

            msg.on('send', function() { throw new Error('not supposed to reply!'); });
            msg.on('done', function() { done(); });

            bot.handleMessage(msg);
        });

        it('responds to help in several variations', function(done)
        {
            var msg = new MockMessage({ text: 'test: help    ' });
            msg.on('send', function(reply)
            {
                reply.must.be.an.object();
                reply.must.have.property('text');
                reply.text.must.match(/^HELP/);
                done();
            });
            bot.handleMessage(msg);
        });

        it('passes messages to plugins for matching', function(done)
        {
            var msg = new MockMessage({text: 'test: statuscat 503'});
            msg.on('send', function(reply)
            {
                reply.must.be.a.string();
                reply.must.match('httpcats.herokuapp.com\/503');
            });
            msg.on('done', function() { done(); });
            bot.handleMessage(msg);
        });

        it('valid plugin commands work without the bot name prefix', function(done)
        {
            var msg = new MockMessage({text: 'test: statuscat 503'});

            msg.on('send', function(reply)
            {
                reply.must.be.a.string();
                reply.must.match('httpcats.herokuapp.com\/503');
            });

            msg.on('done', function() { done(); });
            bot.handleMessage(msg);
        });
    });
});
