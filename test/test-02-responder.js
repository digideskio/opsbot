/*global describe:true, it:true, before:true, after:true, beforeEach: true */
'use strict';

var
    demand      = require('must'),
    Responder   = require('../lib/responder'),
    MockMessage = require('./mocks/message'),
    MockPlugin  = require('./mocks/plugin'),
    StatusCats  = require('../plugins/statuscats')
    ;

describe('Responder', function()
{
    describe('constructor', function()
    {
        it('requires an options object', function(done)
        {
            function shouldThrow() { return new Responder(); }
            shouldThrow.must.throw(/options object/);
            done();
        });

        it('can be constructed', function(done)
        {
            var bot = new Responder({ botname: 'test' });
            bot.must.be.an.object();
            done();
        });
    });

    describe('plugins', function()
    {
        it('are loaded on construction', function(done)
        {
            var opts = {
                botname: 'test',
                plugins: { statuscats: {} }
            };

            var bot = new Responder(opts);
            bot.must.have.property('plugins');
            bot.plugins.must.be.an.object();
            bot.plugins.must.have.property('statuscats');
            bot.plugins.statuscats.must.be.instanceof(StatusCats);
            done();
        });

    });

    describe('message handling', function()
    {
        var bot;

        before(function(done)
        {
            var opts = {
                botname: 'test',
                plugins: { }
            };
            bot = new Responder(opts);
            bot.plugins.mock = new MockPlugin();
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
                reply.text.must.match(/HELP/);
            });
            msg.on('done', function() { done(); });
            bot.handleMessage(msg);
        });

        it('responsds to `status`', function(done)
        {
            var msg = new MockMessage({ text: 'test: status' });
            msg.on('send', function(reply)
            {
                reply.must.be.a.string();
                reply.must.match(/Uptime/);
            });
            msg.on('done', function() { done(); });
            bot.handleMessage(msg);
        });

        it('passes messages to plugins for matching', function(done)
        {
            var msg = new MockMessage({text: 'test: mock one'});
            msg.on('send', function(reply)
            {
                reply.must.be.a.string();
                reply.must.match('test one');
            });
            msg.on('done', function() { done(); });
            bot.handleMessage(msg);
        });

        it('valid plugin commands work without the bot name prefix', function(done)
        {
            var msg = new MockMessage({text: 'mock one'});

            msg.on('send', function(reply)
            {
                reply.must.be.a.string();
                reply.must.match('test one');
            });

            msg.on('done', function() { done(); });
            bot.handleMessage(msg);
        });
    });
});
