import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";

import { PostGQLQueries } from "./graphql";

function App() {
	const initialPostData = { title: '', body: '' };
	const { GET_POSTS, CREATE_POST, UPDATE_POST, DELETE_POST } = PostGQLQueries;

	const [data, setData] = useState([]);
	const [editMode, setEditMode] = useState(true);
	const [editPostId, setEditPostId] = useState(-1);
	const [editText, setEditText] = useState("Edit");
	const [newPostData, setNewPostData] = useState(initialPostData);
	const [editPostData, setEditPostData] = useState(initialPostData);
	const [limit, setLimit] = useState(5);

	let queryData = useQuery(GET_POSTS, { variables: { options: { paginate: { limit, page: 1 } } } });
	const [createPostMutation, { loading: createPostLoading }] = useMutation(CREATE_POST);
	const [updatePostMutation, { loading: updatePostLoading }] = useMutation(UPDATE_POST);
	const [deletePostMutation, { loading: deletePostLoading }] = useMutation(DELETE_POST);

	useEffect(() => {
		if (queryData?.data?.posts?.data?.length) setData([...queryData.data.posts.data]);
	}, [queryData]);

	const handleCreatePost = e => {
		e.preventDefault();

		createPostMutation({ variables: { input: newPostData } })
			.then(res => {
				const { createPost: post } = res?.data ?? {};
				let _data = data;
				_data.unshift(post);
				setData([..._data]);
				setNewPostData(initialPostData);
			})
			.catch(err => {
				console.log(err);
			});
	}

	const handleEditPost = (e, title, body, id) => {
		let _editMode = editMode;

		if (_editMode) {
			setEditPostId(id);
			setEditText("Update");
			setEditPostData({ title, body });
			setEditMode(!_editMode);
		} else if (editPostId === id) {
			setEditPostId(-1);
			setEditText("Edit");
			setEditPostData(initialPostData);
			handleUpdatePost(e, id);
			setEditMode(!_editMode);
		} else {
			setEditPostId(id);
			const postObj = data.find(post => post.id === id);

			if (postObj) {
				const { title, body } = postObj;
				setEditPostData({ title, body });
			}
		}
	}

	const handleUpdatePost = (e, id) => {
		e.preventDefault();
		const updatedPostData = { id, input: editPostData };

		updatePostMutation({ variables: updatedPostData })
			.then(res => {
				const { updatePost: post } = res?.data ?? {};
				const { title, body } = post;

				let _data = data;
				const postIndex = _data.findIndex(postObj => postObj.id === id);
				if (postIndex > -1) _data[postIndex] = { ..._data[postIndex], title, body };
				setData([..._data]);
			})
			.catch(err => {
				console.log(err);
			});
	}

	const handleDeletePost = (e, id) => {
		e.preventDefault();
		const deletePostData = { id };

		deletePostMutation({ variables: deletePostData })
			.then(res => {
				const { deletePost: isPostDeleted } = res?.data ?? {};

				if (isPostDeleted) {
					let _data = data;
					const postIndex = _data.findIndex(postObj => postObj.id === id);
					if (postIndex > -1) _data.splice(postIndex, 1);
					setData([..._data]);
				}
			})
			.catch(err => {
				console.log(err);
			});
	}

	const handleLoadMore = e => {
		e.preventDefault();
		let _limit = limit + 5;
		queryData = queryData.refetch({ options: { paginate: { _limit, page: 1 } } });
		setLimit(_limit);
	}

	return (
		<div className="container mx-20 mt-16">
			<p>
				<input
					type="text"
					placeholder="title"
					value={newPostData.title}
					onChange={e => setNewPostData({ ...newPostData, title: e.target.value })}
				/>
			</p>

			<p>
				<input
					type="text"
					placeholder="body"
					value={newPostData.body}
					onChange={e => setNewPostData({ ...newPostData, body: e.target.value })}
				/>
			</p>

			<p><button onClick={handleCreatePost}>Create Post</button></p>

			<hr />

			{
				queryData.loading || createPostLoading || updatePostLoading || deletePostLoading ? (
					<p>Data is loading...</p>
				) : (
					<>
						{
							data?.map((post, postIndex) => {
								const { id, title, body } = post;

								return (
									<div key={postIndex}>
										<span>
											<b>{postIndex + 1}</b>&nbsp;&nbsp;
											<button onClick={e => { handleEditPost(e, title, body, id); }}>
												{`${editPostId === id ? editText : "Edit"} Post`}
											</button>

											<button style={{ marginLeft: "10px" }} onClick={e => handleDeletePost(e, id)}>
												Delete Post
											</button>
										</span>

										{
											!editMode && editPostId === id ? (
												<>
													<p>
														<input
															type="text"
															placeholder="title"
															value={editPostData.title}
															onChange={e => {
																setEditPostData({ ...editPostData, title: e.target.value });
															}}
														/>
													</p>

													<p>
														<input
															type="text"
															placeholder="body"
															value={editPostData.body}
															onChange={e => {
																setEditPostData({ ...editPostData, body: e.target.value });
															}}
														/>
													</p>
												</>
											) : (
												<>

													<p>Title: <span>{title ?? ''}</span></p>
													<p>Body: <span>{body ?? ''}</span></p>
												</>
											)
										}
										<hr />
									</div>
								);
							})
						}

						<div style={{ display: "flex", justifyContent: "center" }}>
							<button onClick={handleLoadMore}>Load More</button>
						</div>
					</>
				)
			}
		</div>
	);
}

export default App;
