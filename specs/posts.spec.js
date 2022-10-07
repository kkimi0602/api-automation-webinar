'use strict';

const chakram = require('chakram');
const expect = chakram.expect;
const api = require('./utils/api');
const data = require('../server/data.json');

describe('Posts', () => {
    describe('Create', () => {
        let Id;

        it('should add a new post', () => {
            return chakram.post(api.url('posts'), {
                "userId": 1,
                "title": "Post test",
                "body": "Test for the POST.",
            }).then(response => {
                expect(response).to.have.status(201);
                expect(response.body.data.id).to.be.defined;

                Id = response.body.data.id;
                const post = chakram.get(api.url('posts/' + Id),);
                expect(post).to.have.status(200);
                expect(post).to.have.json("data.userId", 1);
                expect(post).to.have.json("data.title", "Post test");
                expect(post).to.have.json("data.body", "Test for the POST.");
                return chakram.wait();
            })
        });

        it('should not add a post with existing Id', () => {
            return chakram.post(api.url("posts"), {
                "id": 1,
                "userId": 1,
                "title": "Post test v2",
                "body": "Test for the POST for existing Id."
            }).then(response => {
                expect(response).to.have.status(500);

                const post1 = chakram.get(api.url("posts/1"));
                expect(post1).to.have.status(200);
                expect(post1).to.have.json("data", data => {
                    expect(data.title).not.to.equal("Post test v2");
                    expect(data.body).not.to.equal("Test for the POST for existing Id.");
                });
                return chakram.wait();
            });
        });

        after(()=>{
            if (Id) {
                return chakram.delete(api.url("posts/" + Id));
            }
        });
    });

    describe('Read', () => {
        it('should have posts', () => {
            const response = chakram.get(api.url('posts'));
            expect(response).to.have.status(200);
            expect(response).to.have.json('data', data => {
                expect(data).to.be.instanceof(Array);
                expect(data.length).to.be.greaterThan(0);
            });
            return chakram.wait();
        });

        it('should return a post by Id', () => {
            const expected = data.posts[0];

            const response = chakram.get(api.url('posts/' + expected.id));
            expect(response).to.have.status(200);
            expect(response).to.have.json('data', post => {
                expect(post).to.be.defined;
                expect(post.id).to.equal(expected.id);
                expect(post.userId).to.equal(expected.userId);
                expect(post.title).to.equal(expected.title);
                expect(post.body).to.equal(expected.body);
            });
            return chakram.wait();
        });

        it('should not return post for invalid Id', () => {
            const response = chakram.get(api.url('posts/invalidId'));
            return expect(response).to.have.status(404);
        });
    });

    describe('Update', () => {
        const original = data.posts[0];

        it('should update existing post with given data', () => {
            return chakram.put(api.url("posts/1"), {
                "userId": 1,
                "id": 1,
                "title": "It has been modified", 
                "body": "It is a new body for a post."
            }).then(response => {
                expect(response).to.have.status(200);

                const update = chakram.get(api.url("posts/1"));
                expect(update).to.have.status(200);
                expect(update).to.have.json("data", post => {
                    expect(post.title).to.equal("It has been modified");
                });
                return chakram.wait();
            });
        });

        it('should throw error if the post does not exist', () => {
            return chakram.put(api.url("posts/200"), {
                "userId": 9,
                "id": 200,
                "title": "no title", 
                "body": "no body"
            }).then(response => {
                expect(response).to.have.status(404);
            });
        });

        after(() => {
            chakram.post(api.url("posts/1"), {
                "userId": original.userId,
                "id": original.id,
                "title": original.title,
                "body": original.body
            });
        });
    });

    describe('Delete', () => {
        const original = data.posts[0];

        it('should delete post by Id', () => {
           return chakram.delete(api.url("posts/1"))
           .then(response => {
                expect(response).to.have.status(200);

                const posts = chakram.get(api.url("posts"));
                expect(posts).to.have.status(200);
                expect(posts).to.have.json("data", data => {
                    data.forEach(post => {
                        expect(post.id).not.to.equal(1);
                    });
                });
                return chakram.wait();
           });
        });

        it('should throw error if the post does not exist', () => {
            const response = chakram.delete(api.url("posts/200"));
            expect(response).to.have.status(404);
            return chakram.wait();
        });    

        after(() => {
            return chakram.post(api.url("posts"), {
                "userId": original.userId,
                "id": original.id,
                "title": original.title,
                "body": original.body
            });
        });
    });
});